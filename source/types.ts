type Props = {
	readonly isOnlyMain?: boolean;
	readonly isShortStatuses?: boolean;
	tags?: string;
};

type CommandResult = {
	command: string;
	message: string;
	status: 'success' | 'error' | 'warning';
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
};

type BlockItemPlain = {
	name: string;
	displayName: string;
	requestedArgs: RequestedArgItem[];
	tags?: string[];
	desc?: string;
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
	CommandResult,
	ChangedFile,
	RequestedArgItem,
	BlockItemPlain,
	BlockItem,
	BlockItemCard,
	AppState,
	Pred,
};
