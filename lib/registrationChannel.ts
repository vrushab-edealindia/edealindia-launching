import { EventEmitter } from "events";

export type RegistrationPayload = {
  id: string;
  name: string;
  phoneNumber: string;
  imageUrl: string;
  location: string;
  createdAt?: string;
};

const channel = new EventEmitter();
channel.setMaxListeners(100);

export function emitRegistration(data: RegistrationPayload) {
  channel.emit("registration", data);
}

export function onRegistration(callback: (data: RegistrationPayload) => void) {
  channel.on("registration", callback);
  return () => channel.off("registration", callback);
}
