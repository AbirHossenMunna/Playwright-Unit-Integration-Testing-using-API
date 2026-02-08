export default class CreateUser {
  constructor(name, email, password, phone_number, nid, role) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.phone_number = phone_number;
    this.nid = nid;
    this.role = role;
  }
}
