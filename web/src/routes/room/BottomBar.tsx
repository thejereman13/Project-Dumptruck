import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce-preact";
import { VideoInfo, PlaylistInfo } from "../../utils/YoutubeTypes";
import { RequestVideo, useGAPIContext, SearchVideo, RequestAllPlaylists, GAPIInfo, RequestVideoForBackend } from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import Input from "preact-mui/lib/input";
import Modal from "preact-mui/lib/modal";
import * as style from "./style.css";
import { Tabs, Tab } from "../../components/Tabs";
import { VideoDisplayCard } from "../../components/VideoCard";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";

interface QueueModalProps {
    currentAPI: GAPIInfo | null;
    submitNewVideo: (newVideo: YoutubeVideoInformation) => void;
}

function QueueModal(props: QueueModalProps): JSX.Element {
    const { currentAPI, submitNewVideo } = props;
    const [searchField, setSearchField] = useState("");
    const [queueTab, setQueueTab] = useState(0);
    const [searchResults, setSearchResults] = useState<VideoInfo[]>([]);
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);

    const [debouncedSearch] = useDebouncedCallback(
        (search: string) => {
            if (currentAPI?.isAPILoaded() && search.length > 0) {
                SearchVideo(search, setSearchResults);
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
                                        info={{ ...list, thumbnailURL: list.thumbnailMaxRes.url }}
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
                                <VideoDisplayCard
                                    key={list.id}
                                    info={{ ...list, thumbnailURL: list.thumbnailMaxRes.url }}
                                    onClick={(id: string): void => console.log(id)}
                                />
                            );
                        })}
                    </div>
                </Tab>
            </div>
        </div>
    );
}

export interface BottomBarProps {
    currentVideo: string; //TODO: swap to VideoInfo once data collection is on front-end
    togglePlay: () => void;
    playing: boolean;
    submitNewVideo: (videoID: string) => void;
}

export function BottomBar(props: BottomBarProps): JSX.Element {
    const { currentVideo, togglePlay, playing, submitNewVideo } = props;
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

    const currentAPI = useGAPIContext();

    useEffect(() => {
        if (currentAPI?.isAPILoaded()) {
            RequestVideo(currentVideo, setVideoInfo);
        }
    }, [currentVideo, currentAPI]);

    return (
        <div>
            <div class={style.BottomBar}>
                {videoInfo ? (
                    <div class={style.videoInfo}>
                        <img class={style.videoIcon} src={videoInfo.thumbnailMaxRes.url} />
                        <div class="mui--text-subhead">{videoInfo.title}</div>
                    </div>
                ) : (
                    <div />
                )}
                <div>
                    <Button size="small" variant="fab" onClick={togglePlay}>
                        <i style={{ fontSize: "32px" }} class="material-icons">
                            {playing ? "pause" : "play_arrow"}
                        </i>
                    </Button>
                </div>
                <div>
                    <Button id="openQueue">Queue Video</Button>
                </div>
            </div>
            <Modal
                className={style.ModalContainer}
                position="center"
                openedBy="openQueue"
                onClose={(): void => console.log("close")}
            >
                <QueueModal currentAPI={currentAPI} submitNewVideo={submitNewVideo} />
            </Modal>
        </div>
    );
}
