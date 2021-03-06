import Controller from '@curveball/controller';
import { Context } from '@curveball/core';
import { BadRequest, NotFound } from '@curveball/http-errors';
import * as privilegeService from '../../privilege/service';
import * as userHal from '../../user/formats/hal';
import * as userService from '../../user/service';
import * as oauth2Service from '../service';

class ValidateTotpController extends Controller {

  async post(ctx: Context) {

    if (ctx.request.type !== 'application/json') {
      throw new BadRequest('Request must have an application/json Content-Type');
    }

    // if (!await privilegeService.hasPrivilege(ctx.state.session.data.user.id, 'validate-bearer')) {
    //  throw new Forbidden('The "validate-bearer" privilege is required to call this endpoint');
    // }

    const bearer = ctx.request.body.bearer;
    const totp = ctx.request.body.totp;

    if (!bearer) {
      throw new BadRequest('The "bearer" property must be provided');
    }
    if (!totp) {
      throw new BadRequest('The "totp" property must be provided');
    }

    let token;
    try {
       token = await oauth2Service.getTokenByAccessToken(bearer);
    } catch (err) {

      if (err instanceof NotFound) {
        throw new BadRequest('Unknown access token');
      } else {
        throw err;
      }

    }

    if (!await userService.validateTotp(token.user, totp)) {
      throw new BadRequest('The one time password was incorrect');
    }

    const privileges = await privilegeService.getPrivilegesForUser(token.user);

    ctx.response.body = userHal.item(token.user, privileges);

  }

}

export default new ValidateTotpController();
