import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { getCodeFromError } from "@app/lib";
import { withZod } from "@remix-validated-form/with-zod";
import { Alert, Col, Form, Row } from "antd";
import { json, Link, useActionData, useSearchParams } from "remix";
import { AuthenticityTokenInput } from "remix-utils";
import { ValidatedForm, validationError } from "remix-validated-form";
import * as z from "zod";
import { FormInput } from "~/components/forms/FormInput";
import { SubmitButton } from "~/components/forms/SubmitButton";
import { validateCsrfToken } from "~/utils/csrf";
import { GraphqlQueryErrorResult } from "~/utils/errors";
import { redirectTyped, TypedDataFunctionArgs } from "~/utils/remix-typed";
import { isSafe } from "~/utils/uri";
import { requireNoUser } from "~/utils/users";

export const handle = { hideLogin: true, title: "Login" };

export const loader = async ({ context }: TypedDataFunctionArgs) => {
  await requireNoUser(context);
  return null;
};

export const action = async ({ request, context }: TypedDataFunctionArgs) => {
  await validateCsrfToken(request, context);
  const sdk = await context.graphqlSdk;
  const fieldValues = await loginFormValidator.validate(
    await request.formData()
  );
  if (fieldValues.error) {
    return validationError(fieldValues.error, {
      username: fieldValues.submittedData.username,
    });
  }
  const { username, password, redirectTo } = fieldValues.data;
  try {
    await sdk.Login({ username, password });
    return redirectTyped(redirectTo ?? "/");
  } catch (e) {
    const code = getCodeFromError(e);
    if (code === "CREDS") {
      return validationError(
        {
          fieldErrors: {
            password: "Incorrect username or passphrase",
          },
        },
        {
          username: fieldValues.submittedData.username,
        }
      );
    }
    return json<GraphqlQueryErrorResult>({
      message: e.message,
      code,
      error: true,
    });
  }
};

const loginSchema = z.object({
  username: z.string().nonempty("Please input your username"),
  password: z.string().nonempty("Please input your passphrase"),
  redirectTo: z.string().optional(),
});

const loginFormValidator = withZod(loginSchema);

export default function LoginEmail() {
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = isSafe(rawNext) ? rawNext : "/";

  const { message, code, error } =
    useActionData<GraphqlQueryErrorResult>() ?? {};

  return (
    <Row justify="center" style={{ marginTop: 32 }}>
      <Col xs={24} sm={12}>
        <Row>
          <ValidatedForm
            validator={loginFormValidator}
            method="post"
            style={{ width: "100%" }}
          >
            <AuthenticityTokenInput />
            <FormInput
              name="username"
              placeholder="E-mail or Username"
              isRequired
              type="text"
              autoComplete="username"
              size="large"
              prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            />
            <FormInput
              name="password"
              placeholder="Passphrase"
              isRequired
              type="password"
              autoComplete="current-password"
              size="large"
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            />
            <Form.Item>
              <Link to="/forgot">
                <a>Forgotten passphrase?</a>
              </Link>
            </Form.Item>
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
              <SubmitButton label="Sign in" />
              <Link style={{ marginLeft: 16 }} to="/login">
                Use a different sign in method
              </Link>
            </Form.Item>
          </ValidatedForm>
        </Row>
      </Col>
    </Row>
  );
}
