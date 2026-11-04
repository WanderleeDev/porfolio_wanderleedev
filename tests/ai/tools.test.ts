import { describe, expect, test } from "bun:test";
import { displayContact, displayProjects, displayTechs, listTracks } from "../../src/ai/tools";
import { PROJECT_CATALOG, TECH_CATALOG } from "../../src/ai/catalog";
import { TRACKS } from "../../src/components/music-player/tracks";
import type { ContactProps, ProjectListProps, TechListProps, TrackListProps } from "../../src/ai/ui-schema";

// The tool runtime passes real execution options; these tools ignore them.
const options = {} as never;

describe("display tools", () => {
    test("displayProjects returns the static catalog without a model", async () => {
        const output = (await displayProjects.execute!({}, options)) as ProjectListProps;

        expect(output.titulo).toBe("Proyectos");
        expect(output.proyectos).toHaveLength(PROJECT_CATALOG.length);
        expect(output.proyectos[0]).toEqual({
            nombre: PROJECT_CATALOG[0]!.nombre,
            descripcion: PROJECT_CATALOG[0]!.descripcion,
            ...(PROJECT_CATALOG[0]!.url ? { url: PROJECT_CATALOG[0]!.url } : {}),
        });
        expect(output.proyectos.at(-1)?.nombre).toBe(PROJECT_CATALOG.at(-1)?.nombre);
    });

    test("displayTechs returns the static catalog without a model", async () => {
        const output = (await displayTechs.execute!({}, options)) as TechListProps;

        expect(output.titulo).toBe("Tecnologías");
        expect(output.techs).toEqual(TECH_CATALOG);
    });

    test("displayContact returns canonical contact data", async () => {
        const output = (await displayContact.execute!({}, options)) as ContactProps;

        expect(output).toEqual({
            name: "Wanderlee Max",
            email: "wanderleedev@gmail.com",
            linkedin: "https://linkedin.com/in/wanderlee-max",
            github: "https://github.com/WanderleeDev",
        });
    });

    test("listTracks returns every track with its title and artist, and no license", async () => {
        const output = (await listTracks.execute!({}, options)) as TrackListProps;

        expect(output.tracks).toHaveLength(TRACKS.length);
        expect(output.tracks).toEqual(
            TRACKS.map(({ title, artist }) => ({ titulo: title, artista: artist })),
        );
        expect(output.tracks.at(-1)?.titulo).toBe(TRACKS.at(-1)?.title);
        expect(Object.keys(output.tracks[0]!)).toEqual(["titulo", "artista"]);
    });
});
