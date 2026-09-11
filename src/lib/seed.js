import { countryFor } from "./countries.js";
const rows = [
  ["AE","Ahmed Khan","FX Academy","Rahul Mehta",12,1.2,2500,6000,"2026-09-18",5],
  ["IN","Rohan Verma","Trade Labs","Sneha Patel",10,1.4,1800,5200,"2026-09-15",4],
  ["GB","Daniel Clark","The Forex Room","Karan Singh",8,1.1,1000,3500,"2026-09-12",3],
  ["FR","Lucas Martin","Smart Trades","Amit Sharma",11,1.3,2000,4800,"2026-09-10",3],
  ["DE","Max Schmidt","Alpha Signals","Rahul Mehta",13,1.3,2500,6000,"2026-09-09",5],
  ["BR","Carlos Silva","Mercado FX","Neha Kapoor",8,1.3,1200,4200,"2026-09-08",5],
  ["MY","Amir Razak","FX Warriors","Sneha Patel",14,1.3,2800,6800,"2026-09-07",5],
  ["ID","Budi Santoso","Signal Pro","Karan Singh",3,1.3,900,2800,"2026-09-06",5],
  ["TH","Nattawat Chai","TH FX","Amit Sharma",7,1.3,1500,3800,"2026-09-05",3],
  ["ZA","Liam Naidoo","Zulu Trades","Rahul Mehta",13,1.3,2500,6000,"2026-09-04",3],
  ["VN","Nguyen Minh","Viet FX","Neha Kapoor",3,1.1,800,3000,"2026-09-02",3],
  ["SG","Jason Lim","Lion Trades","Sneha Patel",13,1.3,2500,3000,"2026-08-30",2],
  ["SA","Fahad Al-Saud","Gulf Traders","Karan Singh",13,1.3,2500,3800,"2026-08-28",2],
  ["AU","Ethan Wilson","Aussie FX","Amit Sharma",3,1.2,2500,3800,"2026-08-25",1],
];
export function seedRecords() {
  return Array.from({ length: 324 }, (_,i) => {
    const [countryCode,clientName,channelName,psmName,ibCommissionPerLot,spreads,upfrontPaid,totalSalary,date,count] = rows[i % rows.length];
    const period = Math.floor(i / rows.length);
    const payoutDate = period ? new Date(Date.UTC(2026, 8 - period, 18 - i % 14)).toISOString().slice(0,10) : date;
    const handle = channelName.toLowerCase().replaceAll(" ", "");
    return { id: `demo-${i + 1}`, countryCode, countryName: countryFor(countryCode).name, clientName, channelName, psmName, ibCommissionPerLot, spreads, upfrontPaid, totalSalary, payoutDate,
      youtubeUrl: count >= 1 ? `https://youtube.com/@${handle}` : "", telegramUrl: count >= 2 ? `https://t.me/${handle}` : "", instagramUrl: count >= 3 ? `https://instagram.com/${handle}` : "", tiktokUrl: count >= 4 ? `https://tiktok.com/@${handle}` : "", snapchatUrl: count >= 5 ? `https://snapchat.com/add/${handle}` : "", createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-01T09:00:00.000Z" };
  });
}
