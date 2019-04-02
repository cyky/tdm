// tslint:disable-next-line:no-implicit-dependencies
import { APIGatewayProxyHandler } from "aws-lambda";

export const hello: APIGatewayProxyHandler = async (event, context) => {
  return {
    body: JSON.stringify({
      input: event,
      message: "Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!",
    }),
    statusCode: 200,
  };
};
