import { Document } from "./document";
import type { DocumentId, Interceptor, UserData } from "./types";

const documents: Map<DocumentId, Document> = new Map();

export const realtime = async (
  documentId: DocumentId,
  initialData?: UserData,
): Promise<Interceptor> => {
  let document = documents.get(documentId);

  if (document) {
    return document.getInterceptor();
  }

  document = new Document();

  documents.set(documentId, document);

  try {
    const collectionName = await getCollectionName();

    await document.launch(collectionName, documentId, initialData);
  } catch (error) {
    // TODO Обработать ошибку
    // TODO Вывести в console.error(error);
    // TODO Вывести в сервис сбора метрик типа Sentry в формате https://github.com/pinojs/pino
    // TODO Показать тостер https://blueprintjs.com/docs/#core/components/toast, чтобы пользователь понял, что, что-то сломалось, именно в нашем реалтайм движке, чтобы могли сказать владельцу сайта.
    console.error(error);
  }

  return document.getInterceptor();
};

export const realtimeSyncLaunch = (documentId: DocumentId, initialData?: UserData): Interceptor => {
  let document = documents.get(documentId);

  if (document) {
    return document.getInterceptor();
  }

  document = new Document();

  documents.set(documentId, document);

  getCollectionName()
    .then((collectionName) => {
      if (document) {
        return document.launch(collectionName, documentId, initialData);
      }
    })
    .catch((error) => {
      // TODO Обработать ошибку
      // TODO Вывести в console.error(error);
      // TODO Вывести в сервис сбора метрик типа Sentry в формате https://github.com/pinojs/pino
      // TODO Показать тостер https://blueprintjs.com/docs/#core/components/toast, чтобы пользователь понял, что, что-то сломалось, именно в нашем реалтайм движке, чтобы могли сказать владельцу сайта.
      console.error(error);
    });

  // ! interceptor является экземпляром Proxy
  return document.getInterceptor();
};

// TODO Реализовать получение имени коллекции с сервера
const getCollectionName = async () => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("tenant-uid-collection-json1");
    }, 2000);
  });
};
