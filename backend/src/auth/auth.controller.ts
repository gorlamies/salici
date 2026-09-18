import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";



@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post("signup")
    async signup(
        @Body() body: SignupDto
    ) { await this.authService.signup(body) }


    @Post("login")
    async login(
        @Body() body: LoginDto
    ) { await this.authService.login(body) }
    /*
        @Post()
        refresh() { }
    */

}