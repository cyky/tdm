import { SQSEvent, SQSHandler } from "aws-lambda";
import axios from "axios";
import cheerio from "cheerio";
import { DynamoDB } from "aws-sdk";

const documentClient = new DynamoDB.DocumentClient();
const baseUrl: string = "https://www.lounaat.info";

interface Restaurant {
  address: String;
  dishes: Dish[];
  kitchenType?: String;
  name: String;
  restaurantType?: String;
}
interface Dish {
  dish: String;
  info?: String;
  price?: String;
}

const writeRestaurantToDynamo: any = (restaurant: Restaurant) => {
  return documentClient
    .put({
      TableName: process.env.DYNAMODB_RESTAURANT_TABLE,
      Item: {
        restaurantName: restaurant.name,
        date: new Date().toISOString(),
        dishes: restaurant.dishes,
        restaurantType: restaurant.restaurantType,
        kitchenType: restaurant.kitchenType
      }
    })
    .promise();
};

export const scrape: SQSHandler = async (event: SQSEvent, _context, cb) => {
  const dayOfMonth = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const dateString = `${dayOfMonth}.${month}.`;

  try {
    console.info(`Detail scaper called with event: ${JSON.stringify(event)}`);
    for (let record of event.Records) {
      const { data } = await axios.get(`${baseUrl}${record.body}`);
      const $ = cheerio.load(data);
      const menuToday = $("#menu .item").filter(function() {
        return $(this)
          .text()
          .includes(dateString);
      });

      let restaurant: Restaurant = {
        kitchenType:
          $(".kitchen-type")
            .text()
            .trim() || null,
        restaurantType:
          $(".restaurant-type")
            .text()
            .trim() || null,
        name: $(".tile-full > h2")
          .text()
          .match(/([A-Z])\w*/g)
          .join(" "),
        address: $(".tile-2 > p")
          .children("span")
          .map((_index: any, element: any) => {
            return $(element).text();
          })
          .get()
          .join(" "),
        dishes: []
      };

      $(menuToday)
        .children(".item-body")
        .children("ul")
        .children("li")
        .each((_itemIndex: any, itemElement) => {
          restaurant.dishes.push({
            dish:
              $(itemElement)
                .find(".dish")
                .text() || null,
            info:
              $(itemElement)
                .find(".info")
                .text()
                .replace(/ +(?= )/g, "") || null,
            price:
              $(itemElement)
                .find(".price")
                .text() || null
          });
        });
      console.info(`Restaurant: ${JSON.stringify(restaurant)}`);
      await writeRestaurantToDynamo(restaurant);
    }
    cb(null);
  } catch (e) {
    console.error(e);
    cb(null);
  }
};
