export default class UserModel {
  constructor(name, email, password, role, profilePicture, createdAt, gender) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.profilePicture = profilePicture;
    this.createdAt = createdAt;
    this.gender = gender;
  }
}
