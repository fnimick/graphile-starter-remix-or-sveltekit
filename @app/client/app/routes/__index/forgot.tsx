import { UserOutlined } from "@ant-design/icons";
import { getCodeFromError } from "@app/lib";
import { json } from "@remix-run/node";
import { Link, useActionData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { Alert, Form } from "antd";
import { AuthenticityTokenInput } from "remix-utils";
import { ValidatedForm, validationError } from "remix-validated-form";
import * as z from "zod";

import { FormInput } from "~/components/forms/FormInput";
import { SubmitButton } from "~/components/forms/SubmitButton";
import { validateCsrfToken } from "~/utils/csrf";
import type { GraphqlQueryErrorResult } from "~/utils/errors";
import type { TypedDataFunctionArgs } from "~/utils/remix-typed";
import { redirectTyped } from "~/utils/remix-typed";
import { requireNoUser } from "~/utils/users";

export const handle = { hideLogin: true, title: "Forgot Password" };

export const loader = async ({ context }: TypedDataFunctionArgs) => {
  await requireNoUser(context);
  return null;
};

export const action = async ({ request, context }: TypedDataFunctionArgs) => {
  await validateCsrfToken(request, context);
  const sdk = await context.graphqlSdk;
  const fieldValues = await forgotPasswordFormValidator.validate(
    await request.formData()
  );
  if (fieldValues.error) {
    return validationError(fieldValues.error, {
      email: fieldValues.submittedData.email,
    });
  }
  const { email } = fieldValues.data;
  try {
    await sdk.ForgotPassword({ email });
    return redirectTyped(`/forgot/success?email=${encodeURIComponent(email)}`);
  } catch (e) {
    const code = getCodeFromError(e);
    return json<GraphqlQueryErrorResult>({
      message: e.message,
      code,
      error: true,
    });
  }
};

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Please input your E-mail.")
    .email("The input is not valid E-mail."),
});

const forgotPasswordFormValidator = withZod(forgotPasswordSchema);

export default function ForgotPassword() {
  const { message, code, error } =
    useActionData<GraphqlQueryErrorResult>() ?? {};

  return (
    <ValidatedForm
      validator={forgotPasswordFormValidator}
      method="post"
      style={{ width: "100%" }}
    >
      <AuthenticityTokenInput />
      <FormInput
        name="email"
        placeholder="Email"
        required
        type="email"
        autoComplete="email"
        prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
      />

      {error ? (
        <Form.Item>
          <Alert
            type="error"
            message={`Sign in failed`}
            description={
              <span>
                {message}
                {code ? (
                  <span>
                    {" "}
                    (Error code: <code>ERR_{code}</code>)
                  </span>
                ) : null}
              </span>
            }
          />
        </Form.Item>
      ) : null}
      <Form.Item>
        <SubmitButton label="Reset password" type="primary" />
        <Link style={{ marginLeft: 16 }} to="/login">
          Use a different sign in method
        </Link>
      </Form.Item>
      <Form.Item>
        <Link to="/login/email">Remembered your password? Log in.</Link>
      </Form.Item>
    </ValidatedForm>
  );
}