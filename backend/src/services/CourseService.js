class CourseService {
  constructor({ pool, courseRepository }) {
    this.pool = pool;
    this.courseRepository = courseRepository;
  }

  async addCourse({ courseCode, courseName, department, creditHour }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const exists = await this.courseRepository.findByCourseCode(courseCode, conn);
      if (exists) {
        return { statusCode: 409, payload: { message: "Course code already exists" } };
      }

      const courseID = await this.courseRepository.createCourse(
        { courseCode, courseName, department, creditHour },
        conn
      );
      await conn.commit();

      return {
        statusCode: 201,
        payload: {
          message: "Course added successfully",
          course: { courseID, courseCode, courseName, department, creditHour },
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async listCourses({ userID, role }) {
    if (role === "instructor") {
      const instructor = await this.courseRepository.findInstructorByUserId(userID);
      if (!instructor) {
        return { statusCode: 404, payload: { message: "Instructor profile not found" } };
      }
      const courses = await this.courseRepository.listInstructorCourses(instructor.instructorID);
      return { statusCode: 200, payload: { courses } };
    }

    if (role === "admin" || role === "student") {
      const courses = await this.courseRepository.listAllCourses();
      return { statusCode: 200, payload: { courses } };
    }

    return { statusCode: 403, payload: { message: "Access denied" } };
  }
}

module.exports = CourseService;

