export type TagItem = {
    tagId: number;
    name: string;
    tagType: string | null;
};

export type TagsResponse = {
    tags: TagItem[];
};
