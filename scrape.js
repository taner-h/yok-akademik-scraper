import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import HtmlTableToJson from "html-table-to-json";
import tabletojson from "tabletojson";
import universities from "./universityURLs.json" assert { type: "json" };
import { Parser } from "@json2csv/plainjs";

async function getUniversityURLs(page) {
  await page.goto(
    "https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp"
  );

  const universityURLs = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(".searchable tr td:first-of-type a"),
      (e) => ({ url: e.href, name: e.innerText })
    )
  );
  //   console.log(universityURLs);
  fs.writeFileSync("universityURLs.json", JSON.stringify(universityURLs));
}

function getNextPageURL(page) {
  return page.evaluate(
    () =>
      document
        .querySelector(".pagination .active")
        .nextElementSibling.querySelector("a").href
  );
}

function checkIfHasNextPage(page) {
  return page.evaluate(
    () => document.querySelector(".pagination .active").nextElementSibling
  );
}

function mergeJSONs() {
  let all = [];
  fs.readdirSync("./output/").forEach((file) => {
    const json = JSON.parse(fs.readFileSync("./output/" + file, "utf8"));
    // console.log(json);
    all = all.concat(json);
  });
  console.log(all.length);
  fs.writeFileSync("all.json", JSON.stringify(all));
}

function convertToCSV() {
  const fields = [
    "Üniversite",
    "ORCID",
    "Araştırmacı ID",
    "Unvan",
    "Ad Soyad",
    "Kadro Yeri",
    "Temel Alan",
    "Bilim Alan",
    "Anahtar Kelime",
    "E-Posta",
    "Araştırmacı GUID ID",
    "URL",
  ];
  const json = JSON.parse(fs.readFileSync("./all.json", "utf8"));
  console.log(json);
  try {
    const opts = { fields };
    console.log(opts);
    const parser = new Parser(opts);
    const csv = parser.parse(json);
    console.log(csv);
    fs.writeFileSync("all.csv", csv);
  } catch (err) {
    console.error(err);
  }
}

async function getAcademiciansOfUniversity(page, university) {
  await page.goto(university.url);

  const json = [];

  while (true) {
    await page.evaluate(() =>
      document.querySelector("#save-list-excel").click()
    );
    await new Promise((r) => setTimeout(r, 1000));
    const table = fs.readFileSync("./download/authorList.xls", "utf8");
    const converted = tabletojson.Tabletojson.convert(table)[0];

    const authorInfos = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[id^='authorInfo']"), (e) => ({
        name: e.querySelector("h4 a").innerText,
        orcid:
          e
            .querySelector(".popoverData")
            ?.getAttribute("data-content")
            .split(":")[1] ?? "",
        url: e.querySelector("h4 a").href,
        guid: e.querySelector("h4 a").href.split("authorId=")[1],
      }))
    );

    let found;
    const merged = converted.map((author) => {
      found = authorInfos.find(
        (i) =>
          i.name === author["Ad Soyad"] ||
          i.guid === author["Araştırmacı GUID ID"]
      );
      return {
        Üniversite: university.name,
        ORCID: found?.orcid,
        ...author,
        // "Anahtar Kelime": author["Anahtar Kelime"]
        //   ? author["Anahtar Kelime"].split(";").map((i) => i.trim())
        //   : null,
        URL: found?.url,
      };
    });

    json.push(...merged);
    console.log(merged);
    if (!(await checkIfHasNextPage(page))) {
      console.log(json.length);
      const savePath = path.resolve(`output/${university.name}.json`);
      fs.writeFileSync(savePath, JSON.stringify(json));
      return merged;
    }
    let nextPageURL = await getNextPageURL(page);
    await page.goto(nextPageURL);
  }
}

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  const download_path = path.resolve("./download");
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: download_path,
  });

  //   const universities = await getUniversityURLs(page);

  const all = [];

  for (const university of universities) {
    const universityData = await getAcademiciansOfUniversity(page, university);
    all.push(...universityData);
  }

  fs.writeFileSync("all.json", JSON.stringify(all));

  await browser.close();
}

run();
// mergeJSONs();
// convertToCSV();
