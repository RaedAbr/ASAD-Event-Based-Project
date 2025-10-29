class User {
  constructor(
    public username: string,
    public password: string,
    public role: "publisher" | "subscriber"
  ) {}
}

export default User;
