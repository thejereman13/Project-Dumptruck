import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce-preact";
import { VideoInfo, PlaylistInfo, videoIDFromURL } from "../../utils/YoutubeTypes";
import { SearchVideo, RequestAllPlaylists, GAPIInfo, RequestVideoForBackend, RequestVideo } from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import Input from "preact-mui/lib/input";
import * as style from "./style.css";
import { Tabs, Tab } from "../../components/Tabs";
import { VideoDisplayCard, PlaylistCard } from "../../components/VideoCard";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";

export interface QueueModalProps {
    currentAPI: GAPIInfo | null;
    submitNewVideo: (newVideo: YoutubeVideoInformation) => void;
}

export function QueueModal(props: QueueModalProps): JSX.Element {
    const { currentAPI, submitNewVideo } = props;
    const [searchField, setSearchField] = useState("");
    const [queueTab, setQueueTab] = useState(0);
    const [searchResults, setSearchResults] = useState<VideoInfo[]>([]);
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);

    const [debouncedSearch] = useDebouncedCallback(
        (search: string) => {
            if (currentAPI?.isAPILoaded() && search.length > 0) {
                const id = videoIDFromURL(search);
                if (id) RequestVideo(id, vid => setSearchResults([vid]));
                else SearchVideo(search, setSearchResults);
            } else {
                setSearchResults([]);
            }
        },
        400,
        [currentAPI]
    );

    useEffect(() => {
        if (currentAPI?.isAPILoaded()) {
            RequestAllPlaylists(setUserPlaylists);
        }
    }, [currentAPI]);

    const updateVideoSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const val = e.currentTarget.value;
        setSearchField(val);
        debouncedSearch(val);
    };

    const submitVideoFromList = (videoID: string): void => {
        console.log("submitting ", videoID);
        RequestVideoForBackend(videoID, submitNewVideo);
    };

    return (
        <div class={style.QueueModal} onClick={(e): void => e.stopPropagation()}>
            <div>
                <Tabs tabNames={["Search", "Playlists"]} index={queueTab} onIndex={setQueueTab} />
            </div>
            <div class={style.sidePanelTabBody}>
                <Tab index={0} tabIndex={queueTab}>
                    <div class={style.searchPanel}>
                        <div class={style.searchDiv}>
                            <Input
                                floatingLabel
                                label="Search For a Video"
                                value={searchField}
                                onChange={updateVideoSearch}
                            />
                            <Button id="openQueue">Search</Button>
                        </div>
                        <div class={style.scrollBox}>
                            {searchResults.map(list => {
                                return (
                                    <VideoDisplayCard
                                        key={list.id}
                                        info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                        onClick={(): void => submitVideoFromList(list.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </Tab>
                <Tab index={1} tabIndex={queueTab}>
                    <div class={style.scrollBox}>
                        {userPlaylists.map(list => {
                            return (
                                <PlaylistCard
                                    key={list.id}
                                    info={list}
                                    onVideoClick={(id: string): void => submitVideoFromList(id)}
                                />
                            );
                        })}
                    </div>
                </Tab>
            </div>
        </div>
    );
}
