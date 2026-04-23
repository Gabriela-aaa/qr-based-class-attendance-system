class StudentProfileService {
  constructor({ studentProfileRepository }) {
    this.studentProfileRepository = studentProfileRepository;
  }

  async getMyProfile(userID) {
    const profile = await this.studentProfileRepository.getStudentProfileByUserId(userID);
    if (!profile) {
      return { statusCode: 404, payload: { message: "Student profile not found" } };
    }
    return { statusCode: 200, payload: { profile } };
  }

  async updateMyProfile({ userID, firstName, lastName, department, year }) {
    const affected = await this.studentProfileRepository.updateStudentProfileByUserId({
      userID,
      firstName,
      lastName,
      department,
      year,
    });

    if (!affected) {
      return { statusCode: 404, payload: { message: "Student profile not found" } };
    }

    const profile = await this.studentProfileRepository.getStudentProfileByUserId(userID);
    return { statusCode: 200, payload: { message: "Profile updated successfully", profile } };
  }
}

module.exports = StudentProfileService;

