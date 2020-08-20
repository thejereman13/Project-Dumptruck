import { h, JSX } from "preact";
import { useGAPIContext, RequestAllPlaylists } from "../../utils/GAPI";
import { useCallback, useState, useEffect } from "preact/hooks";
import { SiteUser } from "../../utils/BackendTypes";
import { GetCurrentUser } from "../../utils/RestCalls";
import { route } from "preact-router";
import { PlaylistInfo } from "../../utils/YoutubeTypes";
import * as style from "./style.css";
import { VideoDisplayCard } from "../../components/VideoCard";
import { useAbortController } from "../../components/AbortController";

export function Profile(): JSX.Element {
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);
    const [user, setUser] = useState<SiteUser | null>(null);

    const currentAPI = useGAPIContext();

    const controller = useAbortController();

    const requestPlaylists = useCallback(() => {
        RequestAllPlaylists(controller, setUserPlaylists);
    }, [controller]);

    useEffect(() => {
        if (currentAPI?.getUser() && currentAPI.isAPILoaded()) requestPlaylists();
    }, [currentAPI, requestPlaylists]);

    useEffect(() => {
        GetCurrentUser(controller).then(usr => {
            if (usr !== null) setUser(usr);
            else route("/login");
        });
    }, [controller]);

    const expandPlaylist = (pID: string): void => {
        console.log(pID);
    };

    return (
        <div class={style.root}>
            {user === null ? (
                <div>
                    <h2>Not Currently Signed In</h2>
                    <h3>Please Wait for Redirect to SignIn Page</h3>
                </div>
            ) : (
                <div>
                    <h2>{`Signed in as ${user.name}`}</h2>
                    <br />
                    <h3>User Playlists:</h3>
                    <div class={style.PlaylistDiv}>
                        {userPlaylists.map(list => {
                            return (
                                <VideoDisplayCard
                                    key={list.id}
                                    info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                    onClick={expandPlaylist}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
