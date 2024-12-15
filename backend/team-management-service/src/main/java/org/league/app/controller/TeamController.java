package org.league.app.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/team")
public class TeamController {

    @GetMapping("/get-teams")
    public String getTeams() {
        return "Teams";
    }

    @GetMapping("/players")
    public String getPlayers() {
        return "Ronaldo: PLAYER";
    }

}
