import { useLearningSession, useLearningSnapshot } from "../state/LearningSession";
export function useSavedLessons() {
  const { store } = useLearningSession();
  const snapshot = useLearningSnapshot();
  function toggleSavedLesson(id: string) {
    if (!snapshot.ready) return;
    const saved = store.getSnapshot().backup.savedIds.includes(id);
    store.setBookmark(id, !saved);
  }
  return {
    savedLessonIds: snapshot.backup.savedIds,
    isSavedLessonsLoaded: snapshot.ready,
    toggleSavedLesson,
    mergeRestoredBookmarks: (ids: string[]) => store.restoreBookmarks(ids),
  };
}
