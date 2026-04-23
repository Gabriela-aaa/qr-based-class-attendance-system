const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AuthService {
  constructor({ pool, authRepository, jwtSecret, jwtExpiresIn }) {
    this.pool = pool;
    this.authRepository = authRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  buildTokenPayload(user) {
    return {
      userID: user.user_id,
      username: user.username,
      role: user.role,
    };
  }

  signToken(payload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  async registerStudent({
    username,
    password,
    studentID,
    firstName,
    lastName,
    department,
    year,
  }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const existingUser = await this.authRepository.findUserByUsername(username, conn);
      if (existingUser) {
        return { statusCode: 409, payload: { message: "Username already exists" } };
      }

      const existingStudent = await this.authRepository.findStudentByStudentId(studentID, conn);
      if (existingStudent) {
        return { statusCode: 409, payload: { message: "Student ID already exists" } };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userID = await this.authRepository.createStudentUser({ username, passwordHash }, conn);
      await this.authRepository.createStudentProfile(
        {
          studentID,
          firstName,
          lastName,
          department,
          year,
          userID,
        },
        conn
      );

      await conn.commit();
      return {
        statusCode: 201,
        payload: {
          message: "Student registered successfully",
          student: { studentID, firstName, lastName, department, year, username },
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async login({ username, password }) {
    const user = await this.authRepository.findUserByUsername(username);
    if (!user) {
      return { statusCode: 401, payload: { message: "Invalid username or password" } };
    }
    if (user.status !== "active") {
      return { statusCode: 403, payload: { message: "Account is inactive" } };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { statusCode: 401, payload: { message: "Invalid username or password" } };
    }

    const token = this.signToken(this.buildTokenPayload(user));
    return {
      statusCode: 200,
      payload: {
        message: "Login successful",
        token,
        user: { userID: user.user_id, username: user.username, role: user.role },
      },
    };
  }
}

module.exports = AuthService;

