const bcrypt = require("bcrypt");

class UserManagementService {
  constructor({ pool, userManagementRepository }) {
    this.pool = pool;
    this.userManagementRepository = userManagementRepository;
  }

  async createInstructorAccount({ username, password, firstName, lastName, department }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const exists = await this.userManagementRepository.findUserByUsername(username, conn);
      if (exists) {
        return { statusCode: 409, payload: { message: "Username already exists" } };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userID = await this.userManagementRepository.createInstructorUser(
        { username, passwordHash },
        conn
      );
      const instructorID = await this.userManagementRepository.getNextInstructorId(conn);

      await this.userManagementRepository.createInstructorProfile(
        { instructorID, firstName, lastName, department, userID },
        conn
      );

      await conn.commit();
      return {
        statusCode: 201,
        payload: {
          message: "Instructor account created successfully",
          instructor: { instructorID, username, firstName, lastName, department },
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = UserManagementService;

