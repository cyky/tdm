import { APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import cheerio from "cheerio";

const baseUrl: string = "https://www.lounaat.info";

export const scrape: APIGatewayProxyHandler = async event => {
  const restaurant = {
    address: null,
    menus: [],
    name: null
  };

  const { data } = await axios.get(`${baseUrl}${event}`);
  const $ = cheerio.load(data);

  restaurant.name = $(".tile-full > h2")
    .text()
    .match(/([A-Z])\w*/g)
    .join(" ");
  restaurant.address = $(".tile-2 > p")
    .children("span")
    .map((_index: any, element: any) => {
      return $(element).text();
    })
    .get()
    .join(" ");

  $("#menu")
    .children(".item")
    .each((_index, element) => {
      const day = $(element)
        .children(".item-header")
        .children("h3")
        .text();
      const items = [];

      $(element)
        .children(".item-body")
        .children("ul")
        .children("li")
        .each((_itemIndex: any, itemElement) => {
          items.push({
            dish: $(itemElement)
              .find(".dish")
              .text(),
            info: $(itemElement)
              .find(".info")
              .text(),
            price: $(itemElement)
              .find(".price")
              .text()
          });
        });
      restaurant.menus.push(day, items);
    });

  return {
    body: JSON.stringify(restaurant),
    statusCode: 200
  };
};
