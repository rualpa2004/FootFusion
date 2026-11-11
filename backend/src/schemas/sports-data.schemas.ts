import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";

@Schema({collection: 'competitions'})
export class SportsCompetition {
    @Prop() external_id!: number;       // Highlightly id
    @Prop() name!: string;
    @Prop() logo?: string;
    @Prop() country_name?: string;
}

@Schema({collection: 'teams'})
export class SportsTeam {
    @Prop() external_id!: number;       // football-data.org id
    @Prop() name!: string;
    @Prop() logo?: string;
    @Prop({type: [Number]}) competition_ids!: number[];
}

@Schema({collection: 'players'})
export class SportsPlayer {
    @Prop() external_id!: number;       // football-data.org id (negative for players created from a box-score)
    @Prop() name!: string;
    @Prop() photo?: string;
    @Prop() team_id?: number;
    @Prop() position_group?: string;
    @Prop() market_value?: number;
}

export const SportsCompetitionSchema = SchemaFactory.createForClass(SportsCompetition);
export const SportsTeamSchema = SchemaFactory.createForClass(SportsTeam);
export const SportsPlayerSchema = SchemaFactory.createForClass(SportsPlayer);
