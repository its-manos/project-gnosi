import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lessons } from "../data/lessons";

const SAVED_LESSONS_STORAGE_KEY = "@gnosi/saved-lesson-ids";
const VALID_LESSON_IDS = new Set(lessons.map((lesson) => lesson.id));
let savedLessonsWriteQueue: Promise<void> = Promise.resolve();

function persistSavedLessonIds(lessonIds: string[]): Promise<void> {
  const serialized = JSON.stringify(lessonIds);
  savedLessonsWriteQueue = savedLessonsWriteQueue.then(async () => {
    try {
      await AsyncStorage.setItem(SAVED_LESSONS_STORAGE_KEY, serialized);
    } catch (error) {
      console.warn("Could not save bookmarked lessons:", error);
    }
  });
  return savedLessonsWriteQueue;
}

function parseSavedLessonIds(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return [...new Set(
      parsed.filter(
        (id): id is string =>
          typeof id === "string" && VALID_LESSON_IDS.has(id)
      )
    )];
  } catch {
    return [];
  }
}

export function useSavedLessons() {
  const [savedLessonIds, setSavedLessonIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedLessons() {
      try {
        const storedValue = await AsyncStorage.getItem(
          SAVED_LESSONS_STORAGE_KEY
        );

        if (isMounted) {
          setSavedLessonIds(parseSavedLessonIds(storedValue));
        }
      } catch (error) {
        console.warn("Could not load saved lessons:", error);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    void loadSavedLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Wait until the first read finishes so we don't overwrite saved data
    // with the initial empty array during startup.
    if (!isLoaded) return;

    void persistSavedLessonIds(savedLessonIds);
  }, [savedLessonIds, isLoaded]);

  function toggleSavedLesson(lessonId: string) {
    if (!isLoaded || !VALID_LESSON_IDS.has(lessonId)) return;

    setSavedLessonIds((currentIds) =>
      currentIds.includes(lessonId)
        ? currentIds.filter((id) => id !== lessonId)
        : [...currentIds, lessonId]
    );
  }

  async function mergeRestoredBookmarks(incomingIds: string[]): Promise<void> {
    if (!isLoaded) throw new Error("local_not_ready");
    const merged = [...new Set([...savedLessonIds, ...incomingIds.filter(id => VALID_LESSON_IDS.has(id))])];
    setSavedLessonIds(merged);
    const write = savedLessonsWriteQueue.then(() => AsyncStorage.setItem(SAVED_LESSONS_STORAGE_KEY, JSON.stringify(merged)));
    savedLessonsWriteQueue = write.catch(() => undefined);
    await write;
  }

  return {
    savedLessonIds,
    isSavedLessonsLoaded: isLoaded,
    toggleSavedLesson,
    mergeRestoredBookmarks,
  };
}
