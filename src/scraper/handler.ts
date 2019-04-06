import { ScheduledHandler } from "aws-lambda";
import axios from "axios";
import cheerio from "cheerio";
import * as AWS from "aws-sdk";

const { SQS_URL, REGION } = process.env;

export const scrape: ScheduledHandler = async () => {
  AWS.config.update({ region: REGION });
  const sqsClient = new AWS.SQS({ apiVersion: "2012-11-05" });

  const restaurantUrls: string[] = [];

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

  for (const url of restaurantUrls) {
    await sqsClient
      .sendMessage({
        QueueUrl: SQS_URL,
        MessageBody: url
      })
      .promise();
  }
};
