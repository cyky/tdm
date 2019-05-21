import axios, { AxiosResponse } from "axios";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const documentClient = new DocumentClient();
const NOMINATIM_API_BASE_URL =
  "https://nominatim.openstreetmap.org/search.php?q=";

interface AddressCoordinates {
  address: string;
  lat: string;
  lon: string;
}

const getCoordinatesFromDynamo = async (
  address: string
): Promise<AddressCoordinates> => {
  const dynamoResponse = await documentClient
    .get({
      TableName: process.env.DYNAMODB_ADDRESS_TABLE,
      Key: { key: address }
    })
    .promise();
  const addressInfo: AddressCoordinates = {
    address: address,
    lat: dynamoResponse.Item.lat,
    lon: dynamoResponse.Item.lon
  };
  return addressInfo;
};

const getCoordinatesFromOpenmapApi = async (
  address: string
): Promise<AddressCoordinates> => {
  let { data } = await axios.get(
    `${NOMINATIM_API_BASE_URL}${address.replace(" ", "+")}`
  );
  let { lat, lon }: { lat: string; lon: string } = data;
  const addressData: AddressCoordinates = {
    address: address,
    lat: lat,
    lon: lon
  };
  return addressData;
};

const writeCoordinatesToDynamo: any = async (
  addressInfo: AddressCoordinates
) => {
  return await documentClient
    .put({
      TableName: process.env.DYNAMODB_ADDRESS_TABLE,
      Item: addressInfo
    })
    .promise();
};

export {
  getCoordinatesFromDynamo,
  getCoordinatesFromOpenmapApi,
  writeCoordinatesToDynamo
};
