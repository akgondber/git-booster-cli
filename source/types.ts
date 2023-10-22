type Props = {
	readonly isOnlyMain?: boolean;
	readonly isOnlyBlock?: string;
	readonly isShortStatuses?: boolean;
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
};

type BlockItemPlain = {
	name: string;
	displayName: string;
	requestedArgs: RequestedArgItem[];
	tags?: string[];
	desc?: string;
	namespaced?: boolean;
};

type BlockItem = BlockItemPlain & {
	id: number;
};
type BlockItemCard = BlockItem & {
	number: number;
};

type AppState = 'WAITING' | 'RUNNING' | 'PERFORMED';

type Pred<T> = (x: T) => boolean;

export type {
	Props,
	CommandStatus,
	CommandState,
	SimpleResult,
	CommandResult,
	ChangedFile,
	RequestedArgItem,
	BlockItemPlain,
	BlockItem,
	BlockItemCard,
	AppState,
	Pred,
};
