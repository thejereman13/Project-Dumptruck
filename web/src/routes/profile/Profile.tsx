import { h, JSX } from "preact";
import { useGoogleClientAPI } from "../../utils/GAPI";
import { useCallback, useState, useEffect } from "preact/hooks";
import { SiteUser } from "../../utils/BackendTypes";
import { GetCurrentUser } from "../../utils/RestCalls";
import { route } from "preact-router";
import { parsePlaylistJSON, PlaylistInfo } from "../../utils/YoutubeTypes";
import * as style from "./style.css";

export function Profile(): JSX.Element {
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);
    const [user, setUser] = useState<SiteUser | null>(null);

    const requestPlaylists = useCallback(() => {
        gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/playlists",
                params: {
                    part: "snippet",
                    mine: true,
                    maxResults: 50
                }
            })
            .then(resp => {
                //  TODO: handle more than one page
                console.log(resp.result.pageInfo);
                setUserPlaylists(resp.result.items.map(parsePlaylistJSON));
            });
    }, []);

    useGoogleClientAPI((success: boolean) => {
        if (success) requestPlaylists();
    });

    useEffect(() => {
        GetCurrentUser().then(usr => {
            if (usr !== null) setUser(usr);
            else route("/login");
        });
    }, []);

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
                    {userPlaylists.map(list => {
                        return <div key={list.id}>{list.title}</div>;
                    })}
                </div>
            )}
        </div>
    );
}
