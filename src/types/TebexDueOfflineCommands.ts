// Generated by https://quicktype.io
//
// To change quicktype's target language, run command:
//
//   "Set quicktype target language"

export interface TebexDueOfflineCommands {
  meta:     MetaO;
  commands: Command[];
}

export interface Command {
  id:         number;
  command:    string;
  payment:    number;
  package:    number;
  conditions: Conditions;
  player:     PlayerO;
}

export interface Conditions {
  delay: number;
}

export interface PlayerO {
  id:   number;
  name: string;
  uuid: string;
}

export interface MetaO {
  limited: boolean;
}