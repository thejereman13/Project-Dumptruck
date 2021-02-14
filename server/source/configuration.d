module configuration;

import vibe.vibe;
import std.stdio;

import DB = database;
import room;
import video;

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

void getRoomSettings(HTTPServerRequest req, HTTPServerResponse res) {
    const long id = req.params["id"].to!long;
    const room = DB.peekRoomInformation(id);
    if (!room.isNull)
        res.writeJsonBody(serializeToJson(room.get()), 201, false);
    else
        res.writeJsonBody("{}", 404, false);
}

struct PublicRoomPreview {
    Video currentVideo;
    ulong userCount;
}

void getRoomPlaying(HTTPServerRequest req, HTTPServerResponse res) {
    const long id = req.params["id"].to!long;
    auto r = getRoom(id);
    if (!r.isNull) {
        PublicRoomPreview rm;
        rm.currentVideo = r.get().getPlaying();
        rm.userCount = r.get().getUserCount();
        res.writeJsonBody(serializeToJson(rm), 200, false);
    } else {
        res.writeJsonBody("{}", 404, false);
    }
}

void getOpenRooms(HTTPServerRequest req, HTTPServerResponse res) {
    const rooms = getActiveRooms();
    res.writeJsonBody(serializeToJson(rooms), 200, false);
}

void createNewRoom(HTTPServerRequest req, HTTPServerResponse res) {
    long id = req.params["id"].to!long;
    if (id < 0) {
        res.writeJsonBody("{}", 400, false);
        return;
    }
    if (id == 0) {
        // if id is 0, generated a random (available) id
        do {
            id = getNextRoomID();
        } while (!DB.peekRoomInformation(id).isNull);
    }
    const info = DB.peekRoomInformation(id);
    if (id > 0 && (info.isNull || info.get.settings.name.length == 0)) {
        // new room
        DB.DBRoomSettings set = DB.DBRoomSettings.defaultSettings();
        set.name = "Room " ~ id.to!string;
        const jset = serializeToJson(set);
        // setRoomSettings will parse out any invalid info, so we assign and serialize again just to be safe
        set = DB.setRoomSettings(id, jset);
        res.writeJsonBody(id, 201, false);
    } else {
        res.writeJsonBody("{}", 400, false);
    }
}
