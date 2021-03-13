import "express-session";

declare module "express-session" {
    interface Session {
        clientID: string;
        username: string;
    }
}