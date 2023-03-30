import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import HtmlTableToJson from "html-table-to-json";
import tabletojson from "tabletojson";
import universities from "./universityURLs.json" assert { type: "json" };

function tableToJson(table) {
  let data = [];
  for (let i = 1; i < table.rows.length; i++) {
    let tableRow = table.rows[i];
    let rowData = [];
    for (let j = 0; j < tableRow.cells.length; j++) {
      rowData.push(tableRow.cells[j].innerHTML);
    }
    data.push(rowData);
  }
  return data;
}

async function getUniversityURLs(page) {
  await page.goto(
    "https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp"
  );

  const universityURLs = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(".searchable tr td:first-of-type a"),
      (e) => ({ url: e.href, university: e.innerText })
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

async function getAcademiciansOfUniversity(page, university) {
  await page.goto(university.url);
  const json = [];

  while (true) {
    await page.evaluate(() =>
      document.querySelector("#save-list-excel").click()
    );
    await new Promise((r) => setTimeout(r, 1000));
    const table = fs.readFileSync("./download/authorList.xls", "utf8");
    const converted = tabletojson.Tabletojson.convert(table);
    json.push(...converted[0]);
    console.log(converted);
    if (!(await checkIfHasNextPage(page))) {
      break;
    }
    let nextPageURL = await getNextPageURL(page);
    await page.goto(nextPageURL);
  }

  fs.writeFileSync("results.json", JSON.stringify(json));

  //   const jsonTables = HtmlTableToJson.parse(table);
  //   console.log(jsonTables.results);

  //   await page.goto(nextPageURL);
  //   nextPageURL = await getNextPageURL(page);
  //   await page.evaluate(() => document.querySelector("#save-list-excel").click());
  //   await new Promise((r) => setTimeout(r, 1000));

  //   const html = await page.evaluate(() => table.querySelector(".table"));
  //   const json = tableToJson(html);

  //   console.log(json);
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
  await getAcademiciansOfUniversity(page, universities[0]);

  await browser.close();
}

run();
