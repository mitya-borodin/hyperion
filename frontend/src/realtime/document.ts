import EventEmitter from "eventemitter3";
import * as json1 from "ot-json1";
import type { Doc } from "sharedb/lib/client";
import { types } from "sharedb/lib/client";
import type { OTType } from "sharedb/lib/sharedb";

import { getConnection } from "./connection";
import { DocumentEvents, InterceptorEvents } from "./events";
import { createInterceptor } from "./Interceptor";
import type { CollectionName, DocumentChange, DocumentId, Interceptor, UserData } from "./types";

types.register(json1.type);

export class Document {
  private eventEmitter: EventEmitter;
  private interceptor: Interceptor;
  private doc: Doc<any> | undefined;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.interceptor = createInterceptor(this.eventEmitter);
    this.doc = undefined;

    this.eventEmitter.on(InterceptorEvents.CHANGE, this.handleInterceptorChange);
  }

  launch = (collectionName: CollectionName, documentID: DocumentId, initialData?: UserData) => {
    const connection = getConnection();

    this.doc = connection.get(collectionName, documentID);

    this.subscribe(initialData);
  };

  getInterceptor = (): Interceptor => {
    return this.interceptor;
  };

  destroy = () => {
    this.eventEmitter.removeAllListeners();
  };

  /**
   * Метод который решает, нужно или нет делать запрос на сервер.
   *
   * Принимает решение исходя из данных в DocumentChange, там есть поле `path`
   * и value. Таким образом можно посмотреть значение в `this.doc` и сравнить
   * его с `value` из DocumentChange, если отличается, то нужно отправить OT
   * операцию на сервер, если нет, то не нужно.
   */
  private handleInterceptorChange = async (change: DocumentChange) => {
    console.log(change);
    console.log(change.path.join("."));
    console.log(this.doc?.data?.[change.path.join(".")], change.value);

    if (this.doc?.data?.[change.path.join(".")] !== change.value) {
      // ? Наиль, как думаешь, может бы тут сразу мутировать this.doc?.data
      // ? чтобы второй раз такой же запрос на сервер не отправить,
      // ? или this.doc?.data как-то связан с вычислением json1 ?
      console.log("TO DO REQUEST TO SHARE_DB");
    }

    /*     const { prop, val, path } = change;
    console.log("HANDLE CHANGE", prop, val, path);
    if (this.doc) {
      const object = this.getNestedObject(this.doc.data, [...path]);
      let Op: any;
      if (typeof val === "number" && typeof object[prop] === "number") {
        const delta = val - object[prop];
        Op = [...path, prop, { ena: delta }];
      }

      this.doc.submitOp(Op);
    } */
  };

  private handleSnapshotUpdate = (op: any) => {
    // TODO Приготовить инфу по которой легко можно обновить interceptor и дать клиенту для реакции на изменения.
    this.eventEmitter.emit(DocumentEvents.UPDATE_SNAPSHOT, this.doc, op);
  };

  private init = () => {
    if (this.doc) {
      this.eventEmitter.emit(DocumentEvents.WAS_INIT, this.doc);
    }
  };

  private subscribe(initialData?: UserData) {
    const doc = this.doc;

    if (doc) {
      doc.subscribe((error) => {
        if (error) return console.error(error);

        if (!doc.type) {
          doc.create(initialData || {}, json1.type.uri as OTType, (error) => {
            if (error) {
              console.error(error);
            } else {
              this.init();
            }
          });
        } else {
          this.init();
        }
      });

      doc.on("op", this.handleSnapshotUpdate);
    }
  }
}
