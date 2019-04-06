import { ScheduledHandler } from "aws-lambda";
import axios from "axios";
import cheerio from "cheerio";
import * as AWS from "aws-sdk";
import { SQS } from "aws-sdk";

AWS.config.update({ region: "eu-west-1" });
const sqsClient = new SQS({ apiVersion: "2012-11-05" });

export const scrape: ScheduledHandler = async () => {
  const restaurantUrls: string[] = [];
  console.log(Object.keys(sqsClient));

  let loadMore = true;
  let pageToLoad = 0;

  while (loadMore) {
    loadMore = false;
    const { data } = await axios.get(
      `https://www.lounaat.info/ajax/filter?view=lahistolla&day=0&page=${pageToLoad}&coords=false`
    );

    if (data !== "") {
      const $ = cheerio.load(data);
      $(".item-header h3 a").each((_index, element) => {
        const link = $(element).attr("href");
        restaurantUrls.push(link);
      });

      loadMore = true;
    }
    pageToLoad++;
  }

  restaurantUrls.forEach(async url => {
    let response = await sqsClient
      .sendMessage({
        QueueUrl:
          "https://eu-west-1.queue.amazonaws.com/697133838664/thedecidermachine-queue",
        MessageBody: url
      })
      .promise();
    console.log(response);
  });
};
