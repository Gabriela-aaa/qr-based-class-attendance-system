class FormValidator {
  static validateRegister(form) {
    if (!form.username || form.username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (!form.password || form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!form.studentID?.trim()) return "Student ID is required";
    if (!form.firstName?.trim()) return "First Name is required";
    if (!form.lastName?.trim()) return "Last Name is required";
    if (!form.department?.trim()) return "Department is required";
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1 || year > 8) {
      return "Year must be between 1 and 8";
    }
    return null;
  }

  static validateLogin(form) {
    if (!form.username?.trim()) return "Username is required";
    if (!form.password) return "Password is required";
    return null;
  }

  static validateInstructorCreate(form) {
    if (!form.username || form.username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (!form.password || form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!form.firstName?.trim()) return "First Name is required";
    if (!form.lastName?.trim()) return "Last Name is required";
    if (!form.department?.trim()) return "Department is required";
    return null;
  }

  static validateCourseCreate(form) {
    if (!form.courseCode?.trim() || form.courseCode.trim().length < 2) {
      return "Course Code must be at least 2 characters";
    }
    if (!form.courseName?.trim() || form.courseName.trim().length < 2) {
      return "Course Name must be at least 2 characters";
    }
    if (!form.department?.trim()) return "Department is required";
    const creditHour = Number(form.creditHour);
    if (!Number.isInteger(creditHour) || creditHour < 1 || creditHour > 12) {
      return "Credit Hour must be between 1 and 12";
    }
    return null;
  }

  static validateStudentProfile(form) {
    if (!form.firstName?.trim()) return "First Name is required";
    if (!form.lastName?.trim()) return "Last Name is required";
    if (!form.department?.trim()) return "Department is required";
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1 || year > 8) {
      return "Year must be between 1 and 8";
    }
    return null;
  }
}

export default FormValidator;

