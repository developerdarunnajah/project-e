export type Env = {
	DB: D1Database;
	JWT_SECRET: string;
	BUCKET: R2Bucket;
};

export type JwtPayload = {
	id: string;
	role: string;
	exp: number;
};

export type Variables = {
	user: JwtPayload;
};