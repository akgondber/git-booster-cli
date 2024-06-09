type Props = {
	readonly isOnlyMain?: boolean;
	readonly isOnlyBlock?: string;
	readonly isShortStatuses?: boolean;
	readonly isShowDescriptions?: boolean;
	tags?: string;
	isOnlyCompound?: boolean;
};

type SimpleResult = {
	message: string;
	status: CommandStatus;
};

type CommandStatus = 'success' | 'error' | 'warning';
type CommandState = CommandStatus | 'unknown';

type CommandResult = SimpleResult & {
	command: string;
};

type ChangedFile = {
	tags: string[];
	staged: boolean;
	name: string;
};

type MapFn = (value: string) => string | undefined;
type CondFn = () => boolean;

type RequestedArgItem = {
	name: string;
	paramName: string;
	required?: boolean;
	path?: string[];
	excludeFromCommand?: boolean;
	mapToRule?: MapFn;
	mapToSelf?: boolean;
	mapToParam?: boolean;
	skipIfAnyPropIsSet?: string[];
	defaultValue?: string;
	hideWhen?: CondFn;
	hideWhenOtherPropertyValueEq?: [string, any];
	hideWhenOtherPropertyValueNotEq?: [string, any];
	hideWhenOtherPropertyValueNotIn?: [string, [string, ...string[]]];
	hideWhenOtherPropertyValueIsFalsey?: [string];
};

type BlockItem = {
	name: string;
	displayName: string;
	requestedArgs: RequestedArgItem[];
	subcommandName?: string;
	tags?: string[];
	desc?: string;
	namespaced?: boolean;
};

type BlockItemCard = BlockItem & {
	number: number;
};

type AppState = 'WAITING' | 'RUNNING' | 'PERFORMED';

type StateRecord = Record<string, any>;

type Pred<T> = (x: T) => boolean;

export type {
	Props,
	CommandStatus,
	CommandState,
	SimpleResult,
	CommandResult,
	ChangedFile,
	RequestedArgItem,
	BlockItem,
	BlockItemCard,
	AppState,
	Pred,
	StateRecord,
};
