// Generated by https://quicktype.io
//
// To change quicktype's target language, run command:
//
//   "Set quicktype target language"

export interface TebexInformation {
  account: Account;
  server:  Server;
}

export interface Account {
  id:          number;
  domain:      string;
  name:        string;
  currency:    Currency;
  online_mode: boolean;
  game_type:   string;
  log_events:  boolean;
}

export interface Currency {
  iso_4217: string;
  symbol:   string;
}

export interface Server {
  id:   number;
  name: string;
}