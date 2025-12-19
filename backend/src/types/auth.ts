export type RegisterRequestBody = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: number;
  email: string;
  created_at: string;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};
