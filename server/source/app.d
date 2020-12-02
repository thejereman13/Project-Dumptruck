import vibe.vibe;
import vibe.http.websockets;
import vibe.core.log;
import std.uuid;
import std.stdio;
import std.functional;

import sockets;
import configuration;
import database;
import authentication;
import video;
import user;

const WebServerVersion = "0.2.0";

version(release)
void main()
{

	readConfigFile();

	auto settings = new HTTPServerSettings;
	settings.bindAddresses = ["::1", "0.0.0.0"];

	settings.port = server_configuration["web_port"].get!ushort;
	settings.tlsContext = createTLSContext(TLSContextKind.server);
	settings.tlsContext.useCertificateChainFile(server_configuration["ssl_cert"].to!string);
	settings.tlsContext.usePrivateKeyFile(server_configuration["ssl_key"].to!string);
	settings.sessionStore = new MemorySessionStore;
	settings.useCompressionIfPossible = true;

	setLogLevel(LogLevel.diagnostic);

	setup();

	auto fileSettings = new HTTPFileServerSettings;
	fileSettings.encodingFileExtension["gzip"] = ".gz";

	auto router = new URLRouter;
	router.get("/api/ws", handleWebSockets(&handleWebsocketConnection));
	router.post("/api/login", &userLogin);
	router.get("/api/login", &getUserLogin);
	router.post("/api/logout", &userLogout);
	router.get("/api/video/:id", &videoInfoRequest);
	router.get("/api/user", &getUserInfo);
	router.delete_("/api/user", &clearUserInfo);
	router.get("/api/user/:id", &getPublicUserInfo);
	router.get("/api/room/:id", &getRoomSettings);
	router.get("*", serveStaticFiles(server_configuration["web_dir"].get!string, fileSettings));
	router.get("/*", serveStaticFile(server_configuration["web_dir"].get!string ~ "/index.html", fileSettings));

	logInfo("Starting Web Server: " ~ WebServerVersion);
	auto l = listenHTTP(settings, router);
	scope(exit) {
		l.stopListening();
		writeln("Server Closing\n");
	}

	runApplication();
}

void setup() {
	initializeDBConnection();
}