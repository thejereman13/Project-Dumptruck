import fs from "fs";
//Constant data values

//Server JSON configurations (constant per runtime)
export const server_configuration: Record<ConfigItems, any> = {
    database_name: "DB",
    database_password: "",
    database_username: "",
    ssl_cert: "",
    ssl_key: "",
    web_dir: ".",
    web_port: "443",
    oauth_secret: "",
};

export enum ConfigItems {
    Port = "web_port",              //TCP port to use for website
    Dir = "web_dir",                //root directory for serving the website
    Cert = "ssl_cert",              //SSL certificate chain file name
    Key = "ssl_key",                //SSL private key file name
    DB_User = "database_username",  //username to use for the database
    DB_Pass = "database_password",  //password for the database
    DB_Name = "database_name",      //name of the database to connect to
    OAuth_Secret = "oauth_secret",  //API secret for getting user auth tokens
}

const configFileName = "configuration.json";

export function readConfigFile(): void {
    if (!fs.statSync(configFileName).isFile())
        throw "No Configuration File Present: server_configuration.json";
    const conf = fs.readFileSync(configFileName, "utf-8");
    const obj = JSON.parse(conf);
    Object.values(ConfigItems).forEach((value) => {
        if (!(value in obj))
            throw "Configuration Item '" + value + "' is missing from the server_configuration.json file";
        server_configuration[value as ConfigItems] = obj[value];
    });
}
