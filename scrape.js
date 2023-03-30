import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import HtmlTableToJson from "html-table-to-json";
import tabletojson from "tabletojson";
// import universities from "./universityURLs.json" assert { type: "json" };

const START = 150; // BURAYI DEGISTIRIN
const END = 180; // BURAYI DEGISTIRIN

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

  const universities = [
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFekfJUFMS1odNamZDPcmG_KRkLi5eSVnKbktSdmDPA1",
      name: "ABDULLAH GÜL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMpJmYkyNIngM-77ba4KxYHv96FgaKCkCWcpWlro_ywH",
      name: "ACIBADEM MEHMET ALİ AYDINLAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxP3rQHcoKkaiKvyE-a1dEhdZ0rDnHIo0dVL3b_ZK_h53",
      name: "ADANA ALPARSLAN TÜRKEŞ BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBwbHPTeecAWmKpSgYpZ5rbKRkLi5eSVnKbktSdmDPA1",
      name: "ADIYAMAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNjX62wmF8WAMW058r3zbNDKRkLi5eSVnKbktSdmDPA1",
      name: "AFYON KOCATEPE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEwqd36bGrkhT5q364Agi4vKRkLi5eSVnKbktSdmDPA1",
      name: "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKtcI6KWK-ygb9r_SSipU18Rd242XOlgWf9_adZszWwP",
      name: "AĞRI İBRAHİM ÇEÇEN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEfHicM3752iV0iLsZeFTgpZ0rDnHIo0dVL3b_ZK_h53",
      name: "AKDENİZ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNfcyfrnglFHd0lV-6ucHYZbvbgQ2O_T1ouh_7FLbWHJ",
      name: "AKSARAY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmIRd242XOlgWf9_adZszWwP",
      name: "ALANYA ALAADDİN KEYKUBAT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDMdzJYxlGc_m0Zb5ZM0PqtbvbgQ2O_T1ouh_7FLbWHJ",
      name: "ALANYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxM8ygaxINsudW9OYUkGz2vfKRkLi5eSVnKbktSdmDPA1",
      name: "ALTINBAŞ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFuyDWGHHuOC9lOT3fteVGxZ0rDnHIo0dVL3b_ZK_h53",
      name: "AMASYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDTNFzEiuOADydprHSe9YxPDSh--IWGUumkwXAa42sRR",
      name: "ANADOLU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD0LfE-tmTfkJ38wfxFe8BVeEQelTm-XyRhBW_4oLHrN",
      name: "ANKARA BİLİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNvYuUGoyuHP0N-DE8_OiM1bvbgQ2O_T1ouh_7FLbWHJ",
      name: "ANKARA HACI BAYRAM VELİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAKdlQCPhUOEUWsCLxOKzv_DSh--IWGUumkwXAa42sRR",
      name: "ANKARA MEDİPOL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMIHrqCvz_E9ckIxrY9E9esRd242XOlgWf9_adZszWwP",
      name: "ANKARA MÜZİK VE GÜZEL SANATLAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEN6Wk4im9SeSkGJIjF9OR3GrwTClGJU9GpHP-_2xehJ",
      name: "ANKARA SOSYAL BİLİMLER ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNu3B_ho5CfWy4lHclpZcOpZ0rDnHIo0dVL3b_ZK_h53",
      name: "ANKARA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCNU_DXXyCSlOUuUg1i79s4_HK2vOcGPj0bi__hecw25",
      name: "ANKARA YILDIRIM BEYAZIT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCgypXlm5M5kv465F__geqFeEQelTm-XyRhBW_4oLHrN",
      name: "ANTALYA BELEK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAcCNBRkONvJUll9hz-9A0ZeEQelTm-XyRhBW_4oLHrN",
      name: "ANTALYA BİLİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOvtYTKlk9AbDzCLWnhnMtq6rGdYDplwTYkFx5fwwQCj",
      name: "ARDAHAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxO2JtvsILbnUYrKBHvHgsokRd242XOlgWf9_adZszWwP",
      name: "ARTVİN ÇORUH ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKIVRZcUs2_QQd2IHkfnKBPGrwTClGJU9GpHP-_2xehJ",
      name: "ATAŞEHİR ADIGÜZEL MESLEK YÜKSEKOKULU",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEFghd_LLZR1ZRbowAYLnctbvbgQ2O_T1ouh_7FLbWHJ",
      name: "ATATÜRK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHr141jPsoFCpRBMKlrFKA-6rGdYDplwTYkFx5fwwQCj",
      name: "ATILIM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIcZ-_MZRd7_y480AegArsjDSh--IWGUumkwXAa42sRR",
      name: "AVRASYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEi6075zsTVyR4TwHyJ6FYJZ0rDnHIo0dVL3b_ZK_h53",
      name: "AYDIN ADNAN MENDERES ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxE4IK0B1XTgOoLvOZcbMLre6rGdYDplwTYkFx5fwwQCj",
      name: "BAHÇEŞEHİR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxE2th9noeRgoh1q60M-dKi0Rd242XOlgWf9_adZszWwP",
      name: "BALIKESİR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmLDSh--IWGUumkwXAa42sRR",
      name: "BANDIRMA ONYEDİ EYLÜL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGAnG4gDdtWhCkBL79JF9JZZ0rDnHIo0dVL3b_ZK_h53",
      name: "BARTIN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxP82kt5Mc4ct7Oe29zp6U6pZ0rDnHIo0dVL3b_ZK_h53",
      name: "BAŞKENT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIzQZ2fTApXLn-_1NjCmL_QRd242XOlgWf9_adZszWwP",
      name: "BATMAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxB7FgXv3KbRjiLYFQEJt28peEQelTm-XyRhBW_4oLHrN",
      name: "BAYBURT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBp97QmMWiIi9QZOkfpEyvoRd242XOlgWf9_adZszWwP",
      name: "BEYKOZ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOcQWbsm449IkoGvuLQuAyjv96FgaKCkCWcpWlro_ywH",
      name: "BEZM-İ ÂLEM VAKIF ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOEbbnQreKDSwy28pvaRjbbv96FgaKCkCWcpWlro_ywH",
      name: "BİLECİK ŞEYH EDEBALİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPAHzVXU857Esoux5x_aF0LGrwTClGJU9GpHP-_2xehJ",
      name: "BİNGÖL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJMsNMIRyH1bFtgoXSGmY5bDSh--IWGUumkwXAa42sRR",
      name: "BİRUNİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHzV4otcMSYRpqFmE0EoxQ1Z0rDnHIo0dVL3b_ZK_h53",
      name: "BİTLİS EREN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOnkPZOxAEEEagNv4tuNufteEQelTm-XyRhBW_4oLHrN",
      name: "BOĞAZİÇİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBECKtHdJtTHrY3MZFZL5XjKRkLi5eSVnKbktSdmDPA1",
      name: "BOLU ABANT İZZET BAYSAL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGfebPWTTEQdd_oBbbF2bwLv96FgaKCkCWcpWlro_ywH",
      name: "BURDUR MEHMET AKİF ERSOY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDSdvNGzoCvTm0tQErocGy3v96FgaKCkCWcpWlro_ywH",
      name: "BURSA TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCjzBMkpA1IGzdpoABQ5yaXGrwTClGJU9GpHP-_2xehJ",
      name: "BURSA ULUDAĞ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOJaNCsyXedw54SAm2uJArTKRkLi5eSVnKbktSdmDPA1",
      name: "ÇAĞ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNFp2th_Hq9rpWI_Ev1wsVBbvbgQ2O_T1ouh_7FLbWHJ",
      name: "ÇANAKKALE ONSEKİZ MART ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJWM_x0vq1Xcvesg4iuX_UNeEQelTm-XyRhBW_4oLHrN",
      name: "ÇANKAYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCZS938s3FsQHTVR_VZbG-HGrwTClGJU9GpHP-_2xehJ",
      name: "ÇANKIRI KARATEKİN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBDpw31jiQVD8uL3dG1D6szDSh--IWGUumkwXAa42sRR",
      name: "ÇUKUROVA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJIlvf1u-N2az8RRFNW0enHDSh--IWGUumkwXAa42sRR",
      name: "DEMİROĞLU BİLİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOO9vW3y0T71m-NOr1gt1MgRd242XOlgWf9_adZszWwP",
      name: "DİCLE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHQkuyoHF8CQgo0hVTiW7i1eEQelTm-XyRhBW_4oLHrN",
      name: "DOĞUŞ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLywU9j_SMnB8k7UgVIkoOQRd242XOlgWf9_adZszWwP",
      name: "DOKUZ EYLÜL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCAyZa2fPZWbP9MtXOb5tIO6rGdYDplwTYkFx5fwwQCj",
      name: "DÜZCE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBW599vjBGdiUNcOxhSTgXe6rGdYDplwTYkFx5fwwQCj",
      name: "EGE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxL0_RO0w2OvBNOfAVoqFAvhZ0rDnHIo0dVL3b_ZK_h53",
      name: "ERCİYES ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDU1Ly4nYssotVBfXvd4bGPKRkLi5eSVnKbktSdmDPA1",
      name: "ERZİNCAN BİNALİ YILDIRIM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDSdvNGzoCvTm0tQErocGy1bvbgQ2O_T1ouh_7FLbWHJ",
      name: "ERZURUM TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxM-AK5E8UWAwy-B6d8lOYtRZ0rDnHIo0dVL3b_ZK_h53",
      name: "ESKİŞEHİR OSMANGAZİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB4_HK2vOcGPj0bi__hecw25",
      name: "ESKİŞEHİR TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOcQWbsm449IkoGvuLQuAyg_HK2vOcGPj0bi__hecw25",
      name: "FATİH SULTAN MEHMET VAKIF ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFYdobWUPO3CCHFVxvzJ7Pw_HK2vOcGPj0bi__hecw25",
      name: "FENERBAHÇE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD4n4AktV62V72rDLQXKQkU_HK2vOcGPj0bi__hecw25",
      name: "FIRAT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMyC39vXDotTTIFDOyLJrUlbvbgQ2O_T1ouh_7FLbWHJ",
      name: "GALATASARAY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCUQ0ZEwXJTH0yEbt0j4Nfu6rGdYDplwTYkFx5fwwQCj",
      name: "GAZİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIXMPT1xViTavllt5V6_VjQ_HK2vOcGPj0bi__hecw25",
      name: "GAZİANTEP İSLAM BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNDS32uNm5ylTCJ4YpMH2me6rGdYDplwTYkFx5fwwQCj",
      name: "GAZİANTEP ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHkr1f6sOC-PJWc7KEe_AfvDSh--IWGUumkwXAa42sRR",
      name: "GEBZE TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBk7Ll7pDTZYBzQNP40MPITGrwTClGJU9GpHP-_2xehJ",
      name: "GİRESUN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDEbtN6UERvaONpPVmb58mQRd242XOlgWf9_adZszWwP",
      name: "GÜMÜŞHANE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKGuDvTNH_9MKvgD4UWH0GpeEQelTm-XyRhBW_4oLHrN",
      name: "HACETTEPE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAdjrbwP68bZFPwCnkziOnvDSh--IWGUumkwXAa42sRR",
      name: "HAKKARİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHoDyt7-OndO4oC0ues2lDPKRkLi5eSVnKbktSdmDPA1",
      name: "HALİÇ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDjWMNEMMrFnvkBVJevzIoHGrwTClGJU9GpHP-_2xehJ",
      name: "HARRAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBUwRSpyqXHm76YRF-h4jZbGrwTClGJU9GpHP-_2xehJ",
      name: "HASAN KALYONCU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFZkCO9ezM7WEwrFbSz-wm5Z0rDnHIo0dVL3b_ZK_h53",
      name: "HATAY MUSTAFA KEMAL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFGlF-YHW7gcFuYI8-9bcntZ0rDnHIo0dVL3b_ZK_h53",
      name: "HİTİT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBq9Jfy248JkeavcYSIRbTpbvbgQ2O_T1ouh_7FLbWHJ",
      name: "IĞDIR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB5Z0rDnHIo0dVL3b_ZK_h53",
      name: "ISPARTA UYGULAMALI BİLİMLER ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPtQcX2KnCxPyxQj0VeVkPxbvbgQ2O_T1ouh_7FLbWHJ",
      name: "IŞIK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmI_HK2vOcGPj0bi__hecw25",
      name: "İBN HALDUN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIL-3IGT-9cpcc-TPDDAO9hZ0rDnHIo0dVL3b_ZK_h53",
      name: "İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGK0GJ6P3y0hUn00Kxirq77GrwTClGJU9GpHP-_2xehJ",
      name: "İNÖNÜ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmJeEQelTm-XyRhBW_4oLHrN",
      name: "İSKENDERUN TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxA0d_WiMUItYrUZ-A8VAvasRd242XOlgWf9_adZszWwP",
      name: "İSTANBUL AREL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB5bvbgQ2O_T1ouh_7FLbWHJ",
      name: "İSTANBUL ATLAS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJQdZHgYz4BJiv5gfCn6XxU_HK2vOcGPj0bi__hecw25",
      name: "İSTANBUL AYDIN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxA2nGnMmKrlcEv8rITKyA2DGrwTClGJU9GpHP-_2xehJ",
      name: "İSTANBUL BEYKENT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAzayLjL8FGlIlQmmY-vafA_HK2vOcGPj0bi__hecw25",
      name: "İSTANBUL BİLGİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGiCPVyAaVI8xmEB5PKWktzv96FgaKCkCWcpWlro_ywH",
      name: "İSTANBUL ESENYURT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCsAcxImFjkhqfuULmp0yqLv96FgaKCkCWcpWlro_ywH",
      name: "İSTANBUL GALATA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAbKr1_L68HfG8FBcYC-NcZZ0rDnHIo0dVL3b_ZK_h53",
      name: "İSTANBUL GEDİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLvGZk5X7ipZPPcN-lgBzr_KRkLi5eSVnKbktSdmDPA1",
      name: "İSTANBUL GELİŞİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKRegAEPZtQ7E0DkzCURsJU_HK2vOcGPj0bi__hecw25",
      name: "İSTANBUL KENT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxL0Esw66Je0vaPTfGYkx1QVeEQelTm-XyRhBW_4oLHrN",
      name: "İSTANBUL KÜLTÜR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDSdvNGzoCvTm0tQErocGy3GrwTClGJU9GpHP-_2xehJ",
      name: "İSTANBUL MEDENİYET ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD4ymJ3W6_aQDLkQTB12kN1Z0rDnHIo0dVL3b_ZK_h53",
      name: "İSTANBUL MEDİPOL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFO7QwEgWfk6ZOI0yCyhMwDv96FgaKCkCWcpWlro_ywH",
      name: "İSTANBUL NİŞANTAŞI ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxH4HeMWzluKTYVDU6q3JvVI_HK2vOcGPj0bi__hecw25",
      name: "İSTANBUL OKAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmLGrwTClGJU9GpHP-_2xehJ",
      name: "İSTANBUL RUMELİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOcQWbsm449IkoGvuLQuAyhZ0rDnHIo0dVL3b_ZK_h53",
      name: "İSTANBUL SABAHATTİN ZAİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLtZP9tSarIGdG2yVqBfhZy6rGdYDplwTYkFx5fwwQCj",
      name: "İSTANBUL SAĞLIK VE SOSYAL BİLİMLER MESLEK YÜKSEKOKULU",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGc3EgtEqm31Ihrirnx5Yq66rGdYDplwTYkFx5fwwQCj",
      name: "İSTANBUL SAĞLIK VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNtE2qI-3Fgs6gZN3Y20WnTDSh--IWGUumkwXAa42sRR",
      name: "İSTANBUL ŞİŞLİ MESLEK YÜKSEKOKULU",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIMFJGwrClkAnVMsSG0D_jrKRkLi5eSVnKbktSdmDPA1",
      name: "İSTANBUL TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAFhjhLxjg1lbLzFaoNL5nRbvbgQ2O_T1ouh_7FLbWHJ",
      name: "İSTANBUL TİCARET ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKFZoYS-p1A_Z33VsA5swtARd242XOlgWf9_adZszWwP",
      name: "İSTANBUL TOPKAPI ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIaUb9OEjncq6s7KCZE9Z6QRd242XOlgWf9_adZszWwP",
      name: "İSTANBUL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNvYuUGoyuHP0N-DE8_OiM3v96FgaKCkCWcpWlro_ywH",
      name: "İSTANBUL ÜNİVERSİTESİ-CERRAHPAŞA",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPo-tmya6lstIgSGVpCRLLJbvbgQ2O_T1ouh_7FLbWHJ",
      name: "İSTANBUL YENİ YÜZYIL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHDGKk7JkD4M5faR7vqanEa6rGdYDplwTYkFx5fwwQCj",
      name: "İSTANBUL 29 MAYIS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLimy6Vq5jdmUdkokf3PKmJZ0rDnHIo0dVL3b_ZK_h53",
      name: "İSTİNYE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKRegAEPZtQ7E0DkzCURsJXGrwTClGJU9GpHP-_2xehJ",
      name: "İZMİR BAKIRÇAY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKRegAEPZtQ7E0DkzCURsJVbvbgQ2O_T1ouh_7FLbWHJ",
      name: "İZMİR DEMOKRASİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGxuMJPOn5ntVmjt2RBQ9ns_HK2vOcGPj0bi__hecw25",
      name: "İZMİR EKONOMİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxDSdvNGzoCvTm0tQErocGy1Z0rDnHIo0dVL3b_ZK_h53",
      name: "İZMİR KATİP ÇELEBİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxA8IKXuFgNC8koCSGq6moty6rGdYDplwTYkFx5fwwQCj",
      name: "İZMİR KAVRAM MESLEK YÜKSEKOKULU",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB7GrwTClGJU9GpHP-_2xehJ",
      name: "İZMİR TINAZTEPE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNh_i5oHLASY5RqzjPc84WU_HK2vOcGPj0bi__hecw25",
      name: "İZMİR YÜKSEK TEKNOLOJİ ENSTİTÜSÜ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOePy8ldnH9b4xGahEKeB-7DSh--IWGUumkwXAa42sRR",
      name: "KADİR HAS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxC0apuVqQF7tA1iLFXdxN2BbvbgQ2O_T1ouh_7FLbWHJ",
      name: "KAFKAS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB7v96FgaKCkCWcpWlro_ywH",
      name: "KAHRAMANMARAŞ İSTİKLAL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxL-uNxRqGrDCAM8EdcJyY4ZZ0rDnHIo0dVL3b_ZK_h53",
      name: "KAHRAMANMARAŞ SÜTÇÜ İMAM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxP_t85WFGlKlhzPYCEwpsnHGrwTClGJU9GpHP-_2xehJ",
      name: "KAPADOKYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEls7qQVXDLM7oCaIKz_3Hi6rGdYDplwTYkFx5fwwQCj",
      name: "KARABÜK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCGDfiPbjv034vSXI-TqeFI_HK2vOcGPj0bi__hecw25",
      name: "KARADENİZ TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJ0HQc76I7JY5GHDV3vdQiQRd242XOlgWf9_adZszWwP",
      name: "KARAMANOĞLU MEHMETBEY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAkKMAodp0zDChNKgkEYt18Rd242XOlgWf9_adZszWwP",
      name: "KASTAMONU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLDYOsPeM4Q-gN1Rc9hdLB4Rd242XOlgWf9_adZszWwP",
      name: "KAYSERİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMc143bNKG9N0I5-6yGjsfMRd242XOlgWf9_adZszWwP",
      name: "KIRIKKALE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNSR2pKQEII-kNUW1RhwRjJeEQelTm-XyRhBW_4oLHrN",
      name: "KIRKLARELİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxA_VCdZU_8lj7LcNbwgMUwhbvbgQ2O_T1ouh_7FLbWHJ",
      name: "KIRŞEHİR AHİ EVRAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHRmZgf_ZxrdQcqxWuywvajGrwTClGJU9GpHP-_2xehJ",
      name: "KİLİS 7 ARALIK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD0LfE-tmTfkJ38wfxFe8BURd242XOlgWf9_adZszWwP",
      name: "KOCAELİ SAĞLIK VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOptp_Q6R0RJJr4Du_BdeBfKRkLi5eSVnKbktSdmDPA1",
      name: "KOCAELİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxO2zuYEEmwMutnWNCvQh3gERd242XOlgWf9_adZszWwP",
      name: "KOÇ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHKTbtMmabEYypcudBH_Z1PGrwTClGJU9GpHP-_2xehJ",
      name: "KONYA GIDA VE TARIM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNVllbL9fB7Q1IkgkouM9s3KRkLi5eSVnKbktSdmDPA1",
      name: "KONYA TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOIttWmOpgJ1-LzuI9bt_k4Rd242XOlgWf9_adZszWwP",
      name: "KTO KARATAY ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBgLMyHw2-4N5Dfzy6SM-UDKRkLi5eSVnKbktSdmDPA1",
      name: "KÜTAHYA DUMLUPINAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMoFilkZ4_on2VNjVwFrBPxeEQelTm-XyRhBW_4oLHrN",
      name: "KÜTAHYA SAĞLIK BİLİMLERİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxASXkGXt3NEiK5su02g5v4vv96FgaKCkCWcpWlro_ywH",
      name: "LOKMAN HEKİM ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMoFilkZ4_on2VNjVwFrBPwRd242XOlgWf9_adZszWwP",
      name: "MALATYA TURGUT ÖZAL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEUkujxR2Oy8DyQu8smk8mwRd242XOlgWf9_adZszWwP",
      name: "MALTEPE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFJkYXCspThoXWVy8g0YEx_KRkLi5eSVnKbktSdmDPA1",
      name: "MANİSA CELÂL BAYAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxM__TMkEAfxfYnq3K6FOx2Dv96FgaKCkCWcpWlro_ywH",
      name: "MARDİN ARTUKLU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKfl8jBXCvns1xIFzx2bOdXv96FgaKCkCWcpWlro_ywH",
      name: "MARMARA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLJgPGPYpu6ANysMuh_HsrQRd242XOlgWf9_adZszWwP",
      name: "MEF ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxG1lKS7LvUSB40liJ9CVxpM_HK2vOcGPj0bi__hecw25",
      name: "MERSİN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJl7OnIr935v084rpaA3XEDDSh--IWGUumkwXAa42sRR",
      name: "MİMAR SİNAN GÜZEL SANATLAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJazFKXrMULRlbNrByHpwusRd242XOlgWf9_adZszWwP",
      name: "MUDANYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPK6AJgBJSd7GwXIJmTis3jv96FgaKCkCWcpWlro_ywH",
      name: "MUĞLA SITKI KOÇMAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBOX0NIzPDTzJffFykJVZoDKRkLi5eSVnKbktSdmDPA1",
      name: "MUNZUR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJ7HxOtYEB2RBntmT-iSxtDv96FgaKCkCWcpWlro_ywH",
      name: "MUŞ ALPARSLAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxErJALI-11UuTmsjufgpbrq6rGdYDplwTYkFx5fwwQCj",
      name: "NECMETTİN ERBAKAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxN4NkVfku1b1m8nYoVvOKD3v96FgaKCkCWcpWlro_ywH",
      name: "NEVŞEHİR HACI BEKTAŞ VELİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNXf_rXfTV1KU8JcUZU1paPGrwTClGJU9GpHP-_2xehJ",
      name: "NİĞDE ÖMER HALİSDEMİR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIrBV4f30vAzOjkBir0C_CbDSh--IWGUumkwXAa42sRR",
      name: "NUH NACİ YAZGAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPtJRSBezEqySDzpfzh2UTLGrwTClGJU9GpHP-_2xehJ",
      name: "ONDOKUZ MAYIS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJEjCY7K1iv_GqVwiR4JnaxbvbgQ2O_T1ouh_7FLbWHJ",
      name: "ORDU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxOsftj70uEzbLdPvSw_S2VjDSh--IWGUumkwXAa42sRR",
      name: "ORTA DOĞU TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGLT6HvCVvzb7ZMAP_GkhFFbvbgQ2O_T1ouh_7FLbWHJ",
      name: "OSMANİYE KORKUT ATA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNkW3MbDtNoqUjsQwDuHjLteEQelTm-XyRhBW_4oLHrN",
      name: "OSTİM TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxPRZcdmK-j_v2BrHXCUxhNg_HK2vOcGPj0bi__hecw25",
      name: "ÖZYEĞİN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxAAagJ-RE-zdMuhf_zwDu6LDSh--IWGUumkwXAa42sRR",
      name: "PAMUKKALE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHyk-Gq4d6bHlR7rdh9ZSAgRd242XOlgWf9_adZszWwP",
      name: "PİRİ REİS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxNqFBOFuci2OkCwYMDzFabXDSh--IWGUumkwXAa42sRR",
      name: "RECEP TAYYİP ERDOĞAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHN0N1NSOzqeQGzH1gZOFoS6rGdYDplwTYkFx5fwwQCj",
      name: "SABANCI ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKlat152aWFf8XPQtVtUuqnDSh--IWGUumkwXAa42sRR",
      name: "SAĞLIK BİLİMLERİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMoFilkZ4_on2VNjVwFrBPxZ0rDnHIo0dVL3b_ZK_h53",
      name: "SAKARYA UYGULAMALI BİLİMLER ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHN0N1NSOzqeQGzH1gZOFoTKRkLi5eSVnKbktSdmDPA1",
      name: "SAKARYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxMoFilkZ4_on2VNjVwFrBPzKRkLi5eSVnKbktSdmDPA1",
      name: "SAMSUN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxHKTbtMmabEYypcudBH_Z1M_HK2vOcGPj0bi__hecw25",
      name: "SANKO ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxC0WYwMeCin7MW9cx7aTSipeEQelTm-XyRhBW_4oLHrN",
      name: "SELÇUK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIFuo5WcJMJZ5nSDuwIVqy4Rd242XOlgWf9_adZszWwP",
      name: "SİİRT ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGdtrsnOAtPINHO_hfWyJ71bvbgQ2O_T1ouh_7FLbWHJ",
      name: "SİNOP ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxF4zhtAGSCUH50jQxrRW_6y6rGdYDplwTYkFx5fwwQCj",
      name: "SİVAS BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxISO_HG8Wb6NEcuZPR6kIBQ_HK2vOcGPj0bi__hecw25",
      name: "SİVAS CUMHURİYET ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBGEvx3dFiEcjdo3GiWtoh9eEQelTm-XyRhBW_4oLHrN",
      name: "SÜLEYMAN DEMİREL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFPIgGkmk_xUIBl7JeulYgHGrwTClGJU9GpHP-_2xehJ",
      name: "ŞIRNAK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxF4zhtAGSCUH50jQxrRW_6zDSh--IWGUumkwXAa42sRR",
      name: "TARSUS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxIrBV4f30vAzOjkBir0C_CZeEQelTm-XyRhBW_4oLHrN",
      name: "TED ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxJlX5b6wTx9ynNKOJeiAre5Z0rDnHIo0dVL3b_ZK_h53",
      name: "TEKİRDAĞ NAMIK KEMAL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxB3O7Jm4-cpb0_A-MTP-GP5eEQelTm-XyRhBW_4oLHrN",
      name: "TOBB EKONOMİ VE TEKNOLOJİ ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLit46ol3804fdsaqDEjd8tbvbgQ2O_T1ouh_7FLbWHJ",
      name: "TOKAT GAZİOSMANPAŞA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxKZVUILUqQTf22nmRnWYtlTKRkLi5eSVnKbktSdmDPA1",
      name: "TOROS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxF4zhtAGSCUH50jQxrRW_6xeEQelTm-XyRhBW_4oLHrN",
      name: "TRABZON ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxCxVhoqCreLqtS6gslug8-g_HK2vOcGPj0bi__hecw25",
      name: "TRAKYA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBKPNTTvtilNRD0ErxlM4Z8_HK2vOcGPj0bi__hecw25",
      name: "TÜRK HAVA KURUMU ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFm03uIPbiBMpEtZOy8slWzv96FgaKCkCWcpWlro_ywH",
      name: "TÜRK-ALMAN ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEixsMvjP_3M7aqb75FRzx1Z0rDnHIo0dVL3b_ZK_h53",
      name: "UFUK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxLcibElLjOisLncNx8aujcs_HK2vOcGPj0bi__hecw25",
      name: "UŞAK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD-d0m4qFHR86zfRNzTjCu1bvbgQ2O_T1ouh_7FLbWHJ",
      name: "ÜSKÜDAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGlvtrxHBjErshsVBG8_9STv96FgaKCkCWcpWlro_ywH",
      name: "VAN YÜZÜNCÜ YIL ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxM85FHaL1CyTMvyVlwZThO1eEQelTm-XyRhBW_4oLHrN",
      name: "YALOVA ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxFTYCdI9KA627mXAUa_wiEwRd242XOlgWf9_adZszWwP",
      name: "YAŞAR ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxBTpt9X0MEWxgJtdmfuP7itZ0rDnHIo0dVL3b_ZK_h53",
      name: "YEDİTEPE ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEl8EQUKbfwLIlEn1g7KR2JeEQelTm-XyRhBW_4oLHrN",
      name: "YILDIZ TEKNİK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxGU1vT-gPi6x-zsmF_m-mUK6rGdYDplwTYkFx5fwwQCj",
      name: "YOZGAT BOZOK ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxD-d0m4qFHR86zfRNzTjCu1eEQelTm-XyRhBW_4oLHrN",
      name: "YÜKSEK İHTİSAS ÜNİVERSİTESİ",
    },
    {
      url: "https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=Kqj-OjUDmmm671jm5WmmxEFmoC-RkpJYlGzBBPlQuEm6rGdYDplwTYkFx5fwwQCj",
      name: "ZONGULDAK BÜLENT ECEVİT ÜNİVERSİTESİ",
    },
  ];

  const sliced = universities.slice(START, END);
  console.log(sliced);
  for (const university of sliced) {
    const universityData = await getAcademiciansOfUniversity(page, university);
    all.push(...universityData);
  }

  fs.writeFileSync("all.json", JSON.stringify(all));

  await browser.close();
}

run();
