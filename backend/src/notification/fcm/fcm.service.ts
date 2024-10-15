import { Injectable } from "@nestjs/common";
import * as firebase from "firebase-admin";
import { isEmpty } from "lodash";
import { UserDocument } from "@/user/schemas/user.schema";
import configuration from "@/core/services/configuration";

@Injectable()
export class FcmService {
  constructor() {
    firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: configuration().firebase.projectId,
        clientEmail: configuration().firebase.clientEmail,
        privateKey: configuration().firebase.privateKey,
      }),
    });
  }

  async sendPushNotification(
    user: UserDocument,
    notification: { title: string; body: string }
  ) {
    if (!user.pushNotificationIsEnabled) return;
    await user.populate("sessions");

    const fcmTokens = user.sessions
      ?.map((session) => session.fcmToken)
      .filter(Boolean);

    if (isEmpty(fcmTokens)) return;

    await firebase.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification,
      data: {
        url: configuration().app.uiUrl,
      },
    });
  }
}
