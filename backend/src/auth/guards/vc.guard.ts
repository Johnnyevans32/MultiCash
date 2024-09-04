// import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
// import { VerifiableCredential } from "@web5/credentials";
// import moment from "moment";

// import { UserService } from "@/user/services/user.service";

// @Injectable()
// export class VcJwtGuard implements CanActivate {
//   constructor(private userService: UserService) {}

//   async canActivate(context: ExecutionContext) {
//     const request = context.switchToHttp().getRequest();
//     const vcJwt = this.extractTokenFromHeader(request.headers.authorization);

//     if (!vcJwt) return false;
//     const { issuer, vc } = await VerifiableCredential.verify({
//       vcJwt: vcJwt,
//     });

//     if (!vc.expirationDate) return false;
//     if (moment().isAfter(vc.expirationDate)) return false;

//     const user = await this.userService.getUserByDid(issuer);
//     if (!user) return false;

//     request.user = user;
//     return true;
//   }

//   private extractTokenFromHeader(authorizationHeader: string) {
//     if (!authorizationHeader) {
//       return null;
//     }
//     const parts = authorizationHeader.split(" ");
//     if (parts.length !== 2 || parts[0] !== "Bearer") {
//       return null;
//     }
//     return parts[1];
//   }
// }
