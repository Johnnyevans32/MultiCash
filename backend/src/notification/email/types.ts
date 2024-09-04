export class Attachment {
  constructor(
    public filename: string,
    public data: string,
    public mimeType: string
  ) {}
}

export class Address {
  constructor(
    public email: string,
    public name: string
  ) {}
}

export class Mail {
  from?: Address;
  to: Array<Address>;
  cc: Array<Address>;
  bcc?: Array<Address>;
  subject: string;
  body: string;
  attachments: Array<Attachment>;
}
