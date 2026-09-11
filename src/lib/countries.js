const codes = "AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CK CR HR CU CW CY CZ CI CD DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FM FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF KP MK MP NO OM PK PW PA PG PY PE PH PN PL PT PR QA CG RO RU RW RE BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS KR SS ES LK PS SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TM TC TV TR UG UA AE GB UM US UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countries = codes.map(code => ({ code, name: names.of(code), label: code === "AE" ? "UAE" : code === "GB" ? "UK" : names.of(code) })).sort((a,b) => a.name.localeCompare(b.name));
export function countryFor(value) {
  const text = String(value ?? "").trim().toLowerCase();
  const aliases = { uk: "GB", uae: "AE", usa: "US", "south korea": "KR", "czech republic": "CZ" };
  return countries.find(c => c.code.toLowerCase() === text || c.name.toLowerCase() === text || c.code === aliases[text]);
}
