import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";

const baseUrl: string = "https://www.lounaat.info"

export const scrape: APIGatewayProxyHandler = async (event) => {
  const { data } = await axios.get(`${baseUrl}${event}`);
  return {
    body: JSON.stringify(data),
    statusCode: 200,
  };
};
