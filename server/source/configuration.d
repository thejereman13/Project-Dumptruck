module configuration;

import vibe.vibe;
import std.stdio;

//Constant data values

//Server JSON configurations (constant per runtime)
Json server_configuration;

const string[] configItems = [
    "web_port",                     //TCP port to use for website
    "web_dir",                      //root directory for serving the website
    "ssl_cert",                     //SSL certificate chain file name
    "ssl_key",                      //SSL private key file name
    "database_username",            //username to use for the database
    "database_password",            //password for the database
    "database_name",                //name of the database to connect to
    "youtube_api_key",              //API key used by the Youtube API v3
];

const string configFileName = "server_configuration.json";

void readConfigFile() {
    import file = std.file;
    if (!file.exists(configFileName) || !file.isFile(configFileName)) {
        throw new Exception("No Configuration File Present: server_configuration.json");
    }
    string conf = cast(string)file.read(configFileName);
    server_configuration = parseJsonString(conf);
    foreach(string s; configItems) {
        if (!(s in server_configuration))
            throw new Exception("Configuration Item \'" ~ s ~ "\' is missing from the server_configuration.json file");
    }
}