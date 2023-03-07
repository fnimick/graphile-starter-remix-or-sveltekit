import { z } from "zod";
import { zfd } from "zod-form-data";

export const passwordsSchema = z
  .object({
    password: zfd.text(
      z.string({ required_error: "Please input your passphrase." })
    ),
    confirm: zfd.text(
      z.string({ required_error: "Please input your passphrase." })
    ),
  })
  .refine(({ password, confirm }) => password === confirm, {
    message: "Make sure your passphrase is the same in both passphrase boxes.",
    path: ["confirm"],
  });

export const otherFieldsSchema = z.object({
  name: zfd.text(z.string({ required_error: "Please input your name." })),
  username: zfd.text(
    z
      .string({ required_error: "Please input your username." })
      .min(2, "Username must be at least 2 characters long.")
      .max(24, "Username must be no more than 24 characters long.")
      .regex(/^([a-zA-Z]|$)/, "Username must start with a letter.")
      .regex(
        /^([^_]|_[^_]|_$)*$/,
        "Username must not contain two underscores next to each other."
      )
      .regex(
        /^[a-zA-Z0-9_]*$/,
        "Username must contain only alphanumeric characters and underscores."
      )
  ),
  email: zfd.text(
    z
      .string({ required_error: "Please input your e-mail." })
      .email("The input is not valid E-mail.")
  ),
  next: z.string().optional(),
});

export const registerSchema = zfd.formData(
  passwordsSchema.and(otherFieldsSchema)
);